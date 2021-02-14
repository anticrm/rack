//
// Copyright © 2020 Anticrm Platform Contributors.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

package storage

import (
	"bufio"
	"context"
	"fmt"
	"github.com/anticrm/rack/yar"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"log"
	"os"
	"path/filepath"
)

func getEndpoint() string {
	return "172.16.0.131:9000"
}

func createClient() (*minio.Client, error) {
	endpoint := getEndpoint()
	accessKeyID := "Q3AM3UQ867SPQQA43P2F"
	secretAccessKey := "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG"
	useSSL := false

	return minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
}

func makeBucket(vm *yar.VM) yar.Value {
	bucket := vm.Next()

	minioClient, err := createClient()
	if err != nil {
		log.Fatalln(err)
	}

	err = minioClient.MakeBucket(context.Background(), bucket.String().Val(vm), minio.MakeBucketOptions{})
	if err != nil {
		log.Fatalln(err)
	}

	return bucket
}

func upload(vm *yar.VM) yar.Value {
	bucket := vm.Next().String().Val(vm)
	root := vm.Next().String().Val(vm)

	minioClient, err := createClient()
	if err != nil {
		log.Fatalln(err)
	}

	err = filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			fmt.Printf("prevent panic by handling failure accessing a path %q: %v\n", path, err)
			return err
		}
		if !info.IsDir() {
			//filePath := filepath.Join(root, path)
			file, err := os.Open(path)
			if err != nil {
				fmt.Errorf("can't open file %s\n", path)
				return err
			}
			reader := bufio.NewReader(file)

			name, _ := filepath.Rel(root, path)
			fmt.Printf("uploading %s from %s... bucket: %s, size: %v\n", name, path, bucket, info.Size())
			info, err := minioClient.PutObject(context.Background(), bucket, name, reader, info.Size(), minio.PutObjectOptions{})
			if err != nil {
				fmt.Errorf("error uploading file %v\n", err)
			}
			fmt.Printf("upload info: %+v\n", info)
		} else {
			fmt.Printf("visited dir: %q\n", path)
		}
		return nil
	})
	if err != nil {
		fmt.Printf("error walking the path %q: %v\n", root, err)
		return yar.None
	}

	return vm.AllocString("http://" + getEndpoint() + "/" + bucket).Value()
}

func StoragePackage() *yar.Pkg {
	result := yar.NewPackage("pkg-storage")
	result.AddFunc("upload", upload)
	result.AddFunc("make-bucket", makeBucket)
	return result
}

const storageY = `
storage: make-object [
    make-bucket: load-native "pkg-storage/make-bucket"
	upload: load-native "pkg-storage/upload"
]
`

func storageModule(vm *yar.VM) yar.Value {
	code := vm.Parse(storageY)
	return vm.BindAndExec(code)
}
